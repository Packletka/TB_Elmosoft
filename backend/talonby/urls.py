from django.contrib import admin
from django.urls import path, include
# from backend.testapp.urls import router

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/test', include('testapp.urls'))
]
