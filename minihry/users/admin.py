from django.contrib import admin
from django.utils.html import format_html
from django.conf import settings  # Potřebujeme pro přístup k STATIC_URL
from .models import Profile

class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'image_tag']

    def image_tag(self, obj):
        if obj.image:
            # Sestavíme URL ručně: spojíme /static/ a cestu uloženou v databázi
            url = f"{settings.STATIC_URL}{obj.image}"
            return format_html('<img src="{}" style="width: 50px; height:50px; border-radius: 50%;" />', url)
        return "-"
    
    image_tag.short_description = 'Avatar'

admin.site.register(Profile, ProfileAdmin)