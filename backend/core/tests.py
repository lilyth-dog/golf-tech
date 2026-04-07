from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


class LoginApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User.objects.create_user("apiuser", "u@example.com", "goodpassword")

    def test_login_success_returns_token(self):
        r = self.client.post(
            "/api/auth/login/",
            {"username": "apiuser", "password": "goodpassword"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn("token", r.data)
        self.assertEqual(r.data["username"], "apiuser")

    def test_login_wrong_password(self):
        r = self.client.post(
            "/api/auth/login/",
            {"username": "apiuser", "password": "bad"},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
