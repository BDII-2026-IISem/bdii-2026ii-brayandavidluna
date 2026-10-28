from django.contrib import admin
from django.test import RequestFactory, TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.test import APIRequestFactory

from authentication.models import CustomUser
from clients.models import Client
from equipment.models import Equipment
from payments.admin import PaymentAdmin, PaymentAdminForm
from payments.models import Payment
from payments.serializers import PaymentSerializer
from service_orders.admin import PaymentInline, ServiceOrderAdmin
from service_orders.models import ServiceOrder
from technicians.models import Technician
from payments.views import PaymentViewSet


class PaymentWorkflowTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="payment-registrar",
            password="test-password",
            email="registrar@example.com",
        )
        self.client_record = Client.objects.create(
            document_type="CC",
            document_number="PAYMENT-CLIENT-1",
            name="Cliente que pagó",
            phone="3000000003",
            email="payer@example.com",
        )
        self.equipment = Equipment.objects.create(
            client=self.client_record,
            name="Equipo de pago",
        )
        self.technician = Technician.objects.create(name="Técnico de pago")
        self.order = ServiceOrder.objects.create(
            client=self.client_record,
            equipment=self.equipment,
            technician=self.technician,
            number="OS-PAYMENT-001",
            opened_at=timezone.now(),
        )

    def payment_data(self):
        return {
            "service_order": self.order.pk,
            "method": "EFECTIVO",
            "amount": "200000.00",
            "payment_date": timezone.now(),
            "status": "COMPLETADO",
        }

    def test_admin_requires_an_order_and_displays_its_client(self):
        form = PaymentAdminForm(data=self.payment_data())
        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(
            form.fields["service_order"].label_from_instance(self.order),
            "OS-PAYMENT-001 — Cliente que pagó — Técnico: Técnico de pago",
        )
        self.assertNotIn(
            "technician_display",
            PaymentAdmin(Payment, admin.site).get_fields(
                RequestFactory().get("/admin/payments/payment/add/")
            ),
        )

        missing_order_form = PaymentAdminForm(
            data={
                "method": "EFECTIVO",
                "amount": "200000.00",
                "payment_date": timezone.now(),
                "status": "COMPLETADO",
            }
        )
        self.assertFalse(missing_order_form.is_valid())
        self.assertIn("service_order", missing_order_form.errors)

    def test_admin_records_the_logged_in_user_and_shows_both_people(self):
        form = PaymentAdminForm(data=self.payment_data())
        self.assertTrue(form.is_valid(), form.errors)
        payment = form.save(commit=False)
        request = RequestFactory().post("/admin/payments/payment/add/")
        request.user = self.user

        PaymentAdmin(Payment, admin.site).save_model(
            request, payment, form, change=False
        )

        self.assertEqual(payment.reference_type, "ORDEN_SERVICIO")
        self.assertEqual(payment.reference_id, self.order.pk)
        self.assertEqual(payment.service_order, self.order)
        self.assertEqual(payment.registered_by, self.user)
        model_admin = PaymentAdmin(Payment, admin.site)
        self.assertEqual(model_admin.get_client(payment), "Cliente que pagó")
        self.assertEqual(model_admin.technician_display(payment), "Técnico de pago")

    def test_api_creation_records_the_authenticated_user(self):
        serializer = PaymentSerializer(data=self.payment_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)
        request = APIRequestFactory().post("/api/v1/payments/")
        request.user = self.user

        view = PaymentViewSet()
        view.request = request
        view.perform_create(serializer)

        self.assertEqual(serializer.instance.registered_by, self.user)
        self.assertEqual(serializer.instance.service_order, self.order)

    def test_api_serializer_requires_order_and_returns_client_and_registrar(self):
        invalid_serializer = PaymentSerializer(data={
            "method": "EFECTIVO",
            "amount": "200000.00",
            "payment_date": timezone.now(),
            "status": "COMPLETADO",
        })
        with self.assertRaises(DRFValidationError):
            invalid_serializer.is_valid(raise_exception=True)

        serializer = PaymentSerializer(data=self.payment_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)
        payment = serializer.save(registered_by=self.user)
        result = PaymentSerializer(payment).data
        self.assertEqual(result["client_name"], "Cliente que pagó")
        self.assertEqual(result["registered_by_username"], "payment-registrar")
        self.assertEqual(result["technician_name"], "Técnico de pago")

    def test_payment_inline_is_available_from_service_order_admin(self):
        inlines = [
            inline.model
            for inline in ServiceOrderAdmin(ServiceOrder, admin.site).inlines
        ]
        self.assertIn(Payment, inlines)
        self.assertEqual(PaymentInline.model, Payment)
        inline = PaymentInline(ServiceOrder, admin.site)
        self.assertEqual(
            inline.technician_display(
                Payment(service_order=self.order)
            ),
            "Técnico de pago",
        )

    def test_service_order_inline_records_the_logged_in_user(self):
        payment = Payment(
            service_order=self.order,
            reference_type="ORDEN_SERVICIO",
            reference_id=self.order.pk,
            method="EFECTIVO",
            amount="200000.00",
            payment_date=timezone.now(),
        )

        class FakePaymentFormset:
            model = Payment
            deleted_objects = []

            def save(self, commit):
                self.assert_commit = commit
                return [payment]

            def save_m2m(self):
                return None

        request = RequestFactory().post("/admin/service_orders/serviceorder/1/change/")
        request.user = self.user
        ServiceOrderAdmin(ServiceOrder, admin.site).save_formset(
            request, form=None, formset=FakePaymentFormset(), change=True
        )

        payment.refresh_from_db()
        self.assertEqual(payment.registered_by, self.user)
