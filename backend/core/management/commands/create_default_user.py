import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from core.models import UserProfile


class Command(BaseCommand):
    help = (
        "Create or update a demo user for local development (idempotent). "
        "Override password with DJANGO_DEFAULT_USER_PASSWORD."
    )

    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_DEFAULT_USER_USERNAME", "demo")
        email = os.environ.get("DJANGO_DEFAULT_USER_EMAIL", "demo@example.com")
        password = os.environ.get("DJANGO_DEFAULT_USER_PASSWORD", "demo1234")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email},
        )
        if not created and user.email != email:
            user.email = email
            user.save(update_fields=["email"])

        user.set_password(password)
        user.save()

        UserProfile.objects.get_or_create(user=user)

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} default user username={username!r} (password from env or default)"
            )
        )
