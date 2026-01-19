from django.db import models
from django.contrib.auth.models import User  # 1. Import the User model

# Create your models here.

class Score(models.Model):
   
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=1) 
    title = models.CharField(max_length=75,default="scored points")
    body = models.FloatField(default=0.0)
    hra = models.CharField(max_length=75,default="nazev hry")
    date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title