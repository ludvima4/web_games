
from django.contrib import admin
from django.urls import path, include
from . import views
from django.conf.urls.static import static 
from django.conf import settings 


# URL nastaveni
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.homepage),
    path('games/', views.games),           # games stranka
    path('dobble/', views.dobble),
    path('snake/', views.snake),  
    path('mereni/', views.mereni),
    path('users/', include('users.urls')),  # users app
    path('score/', include('score.urls'))  # score app

]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) # pridani media url pro obrazky