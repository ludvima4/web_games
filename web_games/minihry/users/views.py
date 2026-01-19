from django.shortcuts import render, redirect 
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm 
from django.contrib.auth import login, logout

import os
from django.conf import settings
from django.core.files import File

def register_view(request):
    if request.method == "POST": 
        form = UserCreationForm(request.POST) 
        if form.is_valid(): 
            user = form.save()
            avatar_choice = request.POST.get('avatar')
            valid_avatars = [f'av_{i}.jpg' for i in range(1, 13)] 
            
            if avatar_choice in valid_avatars:
                # Uložíme pouze RELATIVNÍ cestu k obrázku
                # Předpokládáme, že ve složce static/ máte podsložku avatars
                relative_path = f'avatars/{avatar_choice}'
                
                # Přístup k profilu (předpokládám OneToOneField k User)
                profile = user.profile
                profile.image = relative_path  # Pouze přiřadíme cestu, neukládáme soubor
                profile.save()

            login(request, user)
            return redirect("/games")
    else:
        form = UserCreationForm()
    
    return render(request, "users/register.html", { "form": form })





# login view
def login_view(request): 
    if request.method == "POST": 
        form = AuthenticationForm(data=request.POST)
        if form.is_valid(): 
            login(request, form.get_user())
            if 'next' in request.POST:
                return redirect(request.POST.get('next'))
            else:
                return redirect("/games")  # presmerovani na "games" stranku po registraci
    else: 
        form = AuthenticationForm()
    return render(request, "users/login.html", { "form": form })




# logout view
def logout_view(request):
    if request.method == "POST": 
        logout(request) 
        return redirect("/")  # presmerovani na "home" stranku po registraci