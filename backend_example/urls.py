from django.urls import path
from . import views

urlpatterns = [
    path('api/login/', views.login, name='login'),
    path('api/client_info/', views.client_info, name='client_info'),
] 