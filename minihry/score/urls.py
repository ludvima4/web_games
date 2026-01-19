from django.urls import path
from . import views

app_name = 'score'

urlpatterns = [
    # When a user goes to the base URL for this app, run the 'item_list' view
    path('items/', views.item_list, name='score'),
    path('save_score/', views.save_score, name='save_score'),
]