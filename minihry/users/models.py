from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    # Link to the standard User model
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # The image field
    # 'default.jpg' assumes you have a placeholder image in your media folder
    # 'upload_to' defines the subdirectory inside your MEDIA_ROOT
    image = models.CharField(max_length=255, default='avatars/default.jpg')

    def __str__(self):
        return f'{self.user.username} Profile'