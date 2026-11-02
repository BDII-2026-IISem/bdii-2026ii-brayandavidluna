from django.test import RequestFactory, SimpleTestCase, TestCase
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.urls import NoReverseMatch, reverse
from django.utils import timezone
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from authentication.models import (
    CustomUser,
    RefreshToken,
    Resource,
    ResourceRole,
    Role,
    RoleUser,
)
from clients.admin import ClientAdmin, ClientAdminForm
from clients.models import Client
from equipment.models import Equipment
from payments.models import Payment
from service_orders.admin import (
    ServiceOrderAdmin,
    ServiceOrderAdminForm,
)
from service_orders.models import (
    Diagnosis,
    Quote,
    ServiceOrder,
    SparePartConsumption,
    Warranty,
)
from service_orders.serializers import SparePartConsumptionSerializer
from spare_parts.models import SparePart
from technicians.models import Technician


class ServiceDomainSchemaTests(SimpleTestCase):
    def test_models_map_to_the_existing_sql_tables(self):
        expected_tables = {
            CustomUser: "users",
            Role: "roles",
            RoleUser: "role_users",
            Resource: "resources",
            ResourceRole: "resource_roles",
            RefreshToken: "refresh_tokens",
            Client: "cliente",
            Equipment: "equipo",
            Technician: "tecnico",
            ServiceOrder: "orden_servicio",
            Diagnosis: "diagnostico",
            SparePart: "repuesto",
            SparePartConsumption: "consumo_repuesto",
            Quote: "cotizacion",
            Payment: "pago",
            Warranty: "garantia",
        }

        for model, table_name in expected_tables.items():
            with self.subTest(model=model.__name__):
                self.assertEqual(model._meta.db_table, table_name)

    def test_all_service_domain_crud_routes_are_registered(self):
        route_names = (
            "equipment-list",
            "technician-list",
            "service-order-list",
            "diagnosis-list",
            "spare-part-consumption-list",
            "quote-list",
            "warranty-list",
            "spare-part-list",
            "payment-list",
        )

        for route_name in route_names:
            with self.subTest(route=route_name):
                self.assertTrue(reverse(route_name).startswith("/api/v1/"))

    def test_commercial_product_and_sale_routes_are_not_registered(self):
        with self.assertRaises(NoReverseMatch):
            reverse("product-list")
        with self.assertRaises(NoReverseMatch):
            reverse("sales-list")


class RelatedAdminConfigurationTests(SimpleTestCase):
    def test_related_records_are_inline_on_their_parent_admin_pages(self):
        self.assertIn(
            Equipment,
            [inline.model for inline in ClientAdmin(Client, admin.site).inlines],
        )
        self.assertEqual(
            {
                inline.model
                for inline in ServiceOrderAdmin(ServiceOrder, admin.site).inlines
            },
            {Diagnosis, SparePartConsumption, Quote, Warranty, Payment},
        )

    def test_related_activity_admins_show_the_order_technician(self):
        from service_orders.admin import (
            DiagnosisAdmin,
            QuoteAdmin,
            SparePartConsumptionAdmin,
            WarrantyAdmin,
        )

        for model_admin in (
            DiagnosisAdmin(Diagnosis, admin.site),
            QuoteAdmin(Quote, admin.site),
            SparePartConsumptionAdmin(SparePartConsumption, admin.site),
            WarrantyAdmin(Warranty, admin.site),
        ):
            with self.subTest(model=model_admin.model.__name__):
                self.assertIn("get_technician", model_admin.list_display)

        warranty_admin = WarrantyAdmin(Warranty, admin.site)
        warranty_inline = next(
            inline
            for inline in ServiceOrderAdmin(ServiceOrder, admin.site).inlines
            if inline.model is Warranty
        )(ServiceOrder, admin.site)
        self.assertIn("get_client", warranty_admin.list_display)
        self.assertNotIn("name", warranty_admin.list_display)
        self.assertIn("get_client", warranty_admin.fields)
        self.assertNotIn("name", warranty_admin.fields)
        self.assertIn("client_display", warranty_inline.fields)
        self.assertNotIn("name", warranty_inline.fields)

        from service_orders.admin import (
            DiagnosisAdmin,
            DiagnosisInline,
            QuoteAdmin,
            QuoteInline,
        )

        for model_admin in (
            DiagnosisAdmin(Diagnosis, admin.site),
            QuoteAdmin(Quote, admin.site),
        ):
            with self.subTest(model=model_admin.model.__name__):
                self.assertIn("get_client", model_admin.fields)
                self.assertNotIn("name", model_admin.fields)
                self.assertIn("get_client", model_admin.list_display)
                self.assertNotIn("name", model_admin.list_display)

        for inline_class in (DiagnosisInline, QuoteInline):
            inline = inline_class(ServiceOrder, admin.site)
            with self.subTest(inline=inline.model.__name__):
                self.assertIn("client_display", inline.fields)
                self.assertNotIn("name", inline.fields)


class ServiceOrderAdminFormTests(TestCase):
    def test_rejects_equipment_owned_by_a_different_client(self):
        owner = Client.objects.create(
            document_type="CC",
            document_number="ADMIN-OWNER-1",
            name="Cliente propietario",
            phone="3000000000",
            email="owner@example.com",
        )
        other_client = Client.objects.create(
            document_type="CC",
            document_number="ADMIN-OTHER-1",
            name="Otro cliente",
            phone="3000000001",
            email="other@example.com",
        )
        equipment = Equipment.objects.create(
            client=owner,
            name="Equipo del primer cliente",
        )
        technician = Technician.objects.create(name="Técnico de prueba")

        form = ServiceOrderAdminForm(
            data={
                "client": other_client.pk,
                "equipment": equipment.pk,
                "technician": technician.pk,
                "number": "OS-ADMIN-001",
                "opened_at": "2026-10-27 12:00:00",
                "closed_at": "",
                "total": "0.00",
                "status": "ABIERTA",
            }
        )

        self.assertFalse(form.is_valid())
        self.assertIn("equipment", form.errors)

    def test_warranty_admin_shows_order_client_and_technician_not_its_name(self):
        client = Client.objects.create(
            document_type="CC",
            document_number="WARRANTY-CLIENT-1",
            name="Cliente de garantía",
            phone="3000000004",
            email="warranty@example.com",
        )
        equipment = Equipment.objects.create(client=client, name="Equipo con garantía")
        technician = Technician.objects.create(name="Técnico de garantía")
        order = ServiceOrder.objects.create(
            client=client,
            equipment=equipment,
            technician=technician,
            number="OS-WARRANTY-001",
            opened_at=timezone.now(),
        )
        warranty = Warranty.objects.create(
            service_order=order,
            name="Garantía de mantenimiento",
            start_date="2026-10-27",
            end_date="2027-10-27",
        )

        from service_orders.admin import WarrantyAdmin, WarrantyInline

        warranty_admin = WarrantyAdmin(Warranty, admin.site)
        warranty_inline = WarrantyInline(ServiceOrder, admin.site)
        self.assertEqual(warranty_admin.get_client(warranty), "Cliente de garantía")
        self.assertEqual(warranty_admin.get_technician(warranty), "Técnico de garantía")
        self.assertEqual(warranty_inline.client_display(warranty), "Cliente de garantía")
        self.assertEqual(warranty_inline.technician_display(warranty), "Técnico de garantía")

    def test_quote_and_diagnosis_admin_show_client_and_technician(self):
        client = Client.objects.create(
            document_type="CC",
            document_number="QUOTE-DIAG-CLIENT-1",
            name="Cliente de cotización y diagnóstico",
            phone="3000000005",
            email="quote-diagnosis@example.com",
        )
        equipment = Equipment.objects.create(client=client, name="Equipo cotizado")
        technician = Technician.objects.create(name="Técnico cotizador")
        order = ServiceOrder.objects.create(
            client=client,
            equipment=equipment,
            technician=technician,
            number="OS-QUOTE-DIAG-001",
            opened_at=timezone.now(),
        )
        diagnosis = Diagnosis.objects.create(
            service_order=order,
            name="Nombre interno del diagnóstico",
            description="Descripción del diagnóstico",
        )
        quote = Quote.objects.create(
            service_order=order,
            name="Nombre interno de la cotización",
            description="Descripción de la cotización",
            total_amount="150000.00",
        )

        from service_orders.admin import (
            DiagnosisAdmin,
            DiagnosisInline,
            QuoteAdmin,
            QuoteInline,
        )

        diagnosis_admin = DiagnosisAdmin(Diagnosis, admin.site)
        quote_admin = QuoteAdmin(Quote, admin.site)
        self.assertEqual(diagnosis_admin.get_client(diagnosis), client.name)
        self.assertEqual(diagnosis_admin.get_technician(diagnosis), technician.name)
        self.assertEqual(quote_admin.get_client(quote), client.name)
        self.assertEqual(quote_admin.get_technician(quote), technician.name)
        self.assertEqual(
            DiagnosisInline(ServiceOrder, admin.site).client_display(diagnosis),
            client.name,
        )
        self.assertEqual(
            QuoteInline(ServiceOrder, admin.site).client_display(quote),
            client.name,
        )

    def test_quote_and_diagnosis_created_from_order_inline_get_internal_names(self):
        client = Client.objects.create(
            document_type="CC",
            document_number="INLINE-CLIENT-1",
            name="Cliente de inline",
            phone="3000000006",
            email="inline@example.com",
        )
        equipment = Equipment.objects.create(client=client, name="Equipo de inline")
        technician = Technician.objects.create(name="Técnico inline")
        order = ServiceOrder.objects.create(
            client=client,
            equipment=equipment,
            technician=technician,
            number="OS-INLINE-001",
            opened_at=timezone.now(),
        )

        class FakeFormset:
            deleted_objects = []

            def __init__(self, model, instance):
                self.model = model
                self.instance = instance

            def save(self, commit):
                return [self.instance]

            def save_m2m(self):
                return None

        request = RequestFactory().post("/admin/service_orders/serviceorder/1/change/")
        request.user = CustomUser.objects.create_user(
            username="inline-operator",
            password="test-password",
            email="inline-operator@example.com",
        )
        model_admin = ServiceOrderAdmin(ServiceOrder, admin.site)

        diagnosis = Diagnosis(
            service_order=order,
            name="",
            description="Diagnóstico creado desde la orden",
        )
        model_admin.save_formset(
            request,
            form=None,
            formset=FakeFormset(Diagnosis, diagnosis),
            change=True,
        )

        quote = Quote(
            service_order=order,
            name="",
            description="Cotización creada desde la orden",
            total_amount="150000.00",
        )
        model_admin.save_formset(
            request,
            form=None,
            formset=FakeFormset(Quote, quote),
            change=True,
        )

        diagnosis.refresh_from_db()
        quote.refresh_from_db()
        self.assertEqual(diagnosis.name, f"Diagnóstico - {client.name}")
        self.assertEqual(quote.name, f"Cotización - {client.name}")


class SparePartInventoryTests(TestCase):
    def setUp(self):
        self.client_record = Client.objects.create(
            document_type="CC",
            document_number="STOCK-CLIENT-1",
            name="Cliente de inventario",
            phone="3000000002",
            email="stock@example.com",
        )
        self.equipment = Equipment.objects.create(
            client=self.client_record,
            name="Equipo de inventario",
        )
        self.technician = Technician.objects.create(name="Técnico de inventario")
        self.order = ServiceOrder.objects.create(
            client=self.client_record,
            equipment=self.equipment,
            technician=self.technician,
            number="OS-STOCK-001",
            opened_at=timezone.now(),
        )
        self.part = SparePart.objects.create(
            name="Filtro de prueba",
            price="100.00",
            stock=8,
        )
        self.other_part = SparePart.objects.create(
            name="Capacitor de prueba",
            price="50.00",
            stock=3,
        )

    def test_consumption_decrements_and_quantity_changes_adjust_stock(self):
        consumption = SparePartConsumption.objects.create(
            service_order=self.order,
            spare_part=self.part,
            quantity=3,
            unit_price="100.00",
        )
        self.part.refresh_from_db()
        self.assertEqual(self.part.stock, 5)

        consumption.quantity = 5
        consumption.save()
        self.part.refresh_from_db()
        self.assertEqual(self.part.stock, 3)

        consumption.quantity = 2
        consumption.save()
        self.part.refresh_from_db()
        self.assertEqual(self.part.stock, 6)

    def test_inactivating_or_deleting_consumption_restores_stock(self):
        consumption = SparePartConsumption.objects.create(
            service_order=self.order,
            spare_part=self.part,
            quantity=2,
            unit_price="100.00",
        )
        consumption.status = "INACTIVE"
        consumption.save()
        self.part.refresh_from_db()
        self.assertEqual(self.part.stock, 8)
        consumption.status = "ACTIVE"
        consumption.save()
        self.part.refresh_from_db()
        self.assertEqual(self.part.stock, 6)

        consumption.delete()
        self.part.refresh_from_db()
        self.assertEqual(self.part.stock, 8)


class ClientPortalAccessTests(APITestCase):
    def setUp(self):
        call_command("seed_rbac")
        self.user = CustomUser.objects.create_user(
            username="portal-client",
            email="portal@example.com",
            password="portal-password",
        )
        client_role = Role.objects.get(name="CLIENT")
        RoleUser.objects.create(user=self.user, role=client_role)
        self.client_record = Client.objects.create(
            document_type="CC",
            document_number="PORTAL-CLIENT-1",
            name="Cliente del portal",
            phone="3000000010",
            email="portal@example.com",
            user=self.user,
        )
        other_client = Client.objects.create(
            document_type="CC",
            document_number="PORTAL-CLIENT-2",
            name="Otro cliente del portal",
            phone="3000000011",
            email="other-portal@example.com",
        )
        technician = Technician.objects.create(name="Técnico del portal")
        self.own_order = self._create_order(
            self.client_record, technician, "OS-PORTAL-OWN"
        )
        self.other_order = self._create_order(
            other_client, technician, "OS-PORTAL-OTHER"
        )
        self.own_records = {
            "clients": self.client_record,
            "equipment": self.own_order.equipment,
            "service-orders": self.own_order,
            "diagnoses": Diagnosis.objects.create(
                service_order=self.own_order,
                name="Diagnóstico propio",
                description="Descripción de prueba",
            ),
            "spare-part-consumptions": self._create_consumption(self.own_order),
            "quotes": Quote.objects.create(
                service_order=self.own_order,
                name="Cotización propia",
                total_amount="120.00",
            ),
            "warranties": Warranty.objects.create(
                service_order=self.own_order,
                name="Garantía propia",
                start_date="2026-01-01",
                end_date="2027-01-01",
            ),
            "payments": Payment.objects.create(
                reference_type="ORDEN_SERVICIO",
                reference_id=self.own_order.pk,
                service_order=self.own_order,
                method="EFECTIVO",
                amount="120.00",
                payment_date=timezone.now(),
            ),
        }
        self.other_records = {
            "clients": other_client,
            "equipment": self.other_order.equipment,
            "service-orders": self.other_order,
            "diagnoses": Diagnosis.objects.create(
                service_order=self.other_order,
                name="Diagnóstico ajeno",
                description="Descripción de prueba",
            ),
            "spare-part-consumptions": self._create_consumption(self.other_order),
            "quotes": Quote.objects.create(
                service_order=self.other_order,
                name="Cotización ajena",
                total_amount="130.00",
            ),
            "warranties": Warranty.objects.create(
                service_order=self.other_order,
                name="Garantía ajena",
                start_date="2026-01-01",
                end_date="2027-01-01",
            ),
            "payments": Payment.objects.create(
                reference_type="ORDEN_SERVICIO",
                reference_id=self.other_order.pk,
                service_order=self.other_order,
                method="EFECTIVO",
                amount="130.00",
                payment_date=timezone.now(),
            ),
        }
        token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    @staticmethod
    def _create_order(client, technician, number):
        equipment = Equipment.objects.create(
            client=client,
            name=f"Equipo de {number}",
        )
        return ServiceOrder.objects.create(
            client=client,
            equipment=equipment,
            technician=technician,
            number=number,
            opened_at=timezone.now(),
        )

    @staticmethod
    def _create_consumption(order):
        part = SparePart.objects.create(
            name=f"Repuesto de {order.number}",
            price="10.00",
            stock=1,
        )
        return SparePartConsumption.objects.create(
            service_order=order,
            spare_part=part,
            quantity=1,
            unit_price="10.00",
        )

    def test_client_can_read_only_its_related_service_data(self):
        for collection, own_record in self.own_records.items():
            with self.subTest(collection=collection):
                response = self.client.get(f"/api/v1/{collection}/")
                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    [record["id"] for record in response.json()],
                    [own_record.pk],
                )

                other_record = self.other_records[collection]
                detail_response = self.client.get(
                    f"/api/v1/{collection}/{other_record.pk}/"
                )
                self.assertEqual(detail_response.status_code, 404)

        self.assertEqual(
            self.client.get("/api/v1/spare-parts/").status_code,
            403,
        )
        self.assertEqual(
            self.client.post("/api/v1/service-orders/", {}, format="json").status_code,
            403,
        )

    def test_client_admin_requires_the_client_role_for_account_linking(self):
        unassigned_user = CustomUser.objects.create_user(
            username="unassigned-portal-user",
            email="unassigned@example.com",
            password="portal-password",
        )
        form_data = {
            "document_type": "CC",
            "document_number": "PORTAL-ADMIN-LINK",
            "name": "Cliente vinculado",
            "phone": "3000000012",
            "email": "linked@example.com",
            "user": unassigned_user.pk,
            "address": "",
            "is_active": "ACTIVE",
        }

        invalid_form = ClientAdminForm(data=form_data)
        self.assertFalse(invalid_form.is_valid())
        self.assertIn("user", invalid_form.errors)

        RoleUser.objects.create(
            user=unassigned_user,
            role=Role.objects.get(name="CLIENT"),
        )
        valid_form = ClientAdminForm(data=form_data)
        self.assertTrue(valid_form.is_valid(), valid_form.errors)


class SparePartInventoryEdgeCaseTests(TestCase):
    def setUp(self):
        client = Client.objects.create(
            document_type="CC",
            document_number="STOCK-EDGE-CLIENT",
            name="Cliente de inventario",
            phone="3000000002",
            email="stock-edge@example.com",
        )
        equipment = Equipment.objects.create(
            client=client,
            name="Equipo de inventario",
        )
        technician = Technician.objects.create(name="Técnico de inventario")
        self.order = ServiceOrder.objects.create(
            client=client,
            equipment=equipment,
            technician=technician,
            number="OS-STOCK-EDGE",
            opened_at=timezone.now(),
        )
        self.part = SparePart.objects.create(
            name="Filtro de prueba",
            price="100.00",
            stock=8,
        )
        self.other_part = SparePart.objects.create(
            name="Capacitor de prueba",
            price="50.00",
            stock=3,
        )

    def test_changing_spare_part_returns_old_stock_and_reserves_new_stock(self):
        consumption = SparePartConsumption.objects.create(
            service_order=self.order,
            spare_part=self.part,
            quantity=2,
            unit_price="100.00",
        )
        consumption.spare_part = self.other_part
        consumption.quantity = 2
        consumption.save()
        self.part.refresh_from_db()
        self.other_part.refresh_from_db()
        self.assertEqual(self.part.stock, 8)
        self.assertEqual(self.other_part.stock, 1)

    def test_insufficient_or_inactive_stock_is_rejected_without_changes(self):
        with self.assertRaises(ValidationError):
            SparePartConsumption.objects.create(
                service_order=self.order,
                spare_part=self.part,
                quantity=9,
                unit_price="100.00",
            )
        self.part.refresh_from_db()
        self.assertEqual(self.part.stock, 8)

        self.other_part.status = "INACTIVE"
        self.other_part.save()
        with self.assertRaises(ValidationError):
            SparePartConsumption.objects.create(
                service_order=self.order,
                spare_part=self.other_part,
                quantity=1,
                unit_price="50.00",
            )
        self.other_part.refresh_from_db()
        self.assertEqual(self.other_part.stock, 3)

    def test_api_serializer_returns_validation_error_for_insufficient_stock(self):
        serializer = SparePartConsumptionSerializer(
            data={
                "service_order": self.order.pk,
                "spare_part": self.part.pk,
                "quantity": 9,
                "unit_price": "100.00",
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

        with self.assertRaises(DRFValidationError):
            serializer.save()

        self.part.refresh_from_db()
        self.assertEqual(self.part.stock, 8)
