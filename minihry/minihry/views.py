# from django.http import HttpResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required


# view pro homepage
def homepage(request):
    # return HttpResponse("Hello World! I'm Home.")
    return render(request, 'home.html')


#zobrazení hry dobble 
@login_required(login_url="/users/login/")  # viditelne pouze pro prihlasene uzivatele
def dobble(request):
    # return HttpResponse("Dobble page.")
    return render(request, 'dobble.html')

#zobrazení hry snake 
  # viditelne pouze pro prihlasene uzivatele
@login_required(login_url="/users/login/")
def snake(request):
    # return HttpResponse("Dobble page.")
    return render(request, 'snake.html')


#zobrazení hry mereni 
@login_required(login_url="/users/login/")  # viditelne pouze pro prihlasene uzivatele
def mereni(request):
    # return HttpResponse("Dobble page.")
    return render(request, 'mereni.html')



# view pro games page
@login_required(login_url="/users/login/")  # viditelne pouze pro prihlasene uzivatele
def games(request):
    # return HttpResponse("Games page.")
    return render(request, 'games.html')