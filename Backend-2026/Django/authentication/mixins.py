class ClientScopedQuerysetMixin:
    client_scope_lookup = "client__user"

    def get_queryset(self):
        queryset = super().get_queryset()
        role_names = set(
            self.request.user.user_roles.values_list("role__name", flat=True)
        )

        if "ADMIN" in role_names or "CLIENT" not in role_names:
            return queryset

        return queryset.filter(
            **{self.client_scope_lookup: self.request.user}
        )
