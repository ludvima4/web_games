from django.shortcuts import render
from .models import Score 
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
import json 

# definice View pro zobrazení seznamu skóre
def item_list(request):
    from django.db.models import Max, Min 
    # Funkce pro získání žebříčku podle maximálního skóre pro danou hru
    def get_leaderboard_max(game_name):
        return Score.objects.filter(hra=game_name).values('user__username').annotate(max_score=Max('body')).order_by('-max_score')[:3]
    # Funkce pro získání žebříčku podle minimálního skóre, kde skóre je čas (nižší je lepší)
    def get_leaderboard_min(game_name):
        return Score.objects.filter(hra=game_name).values('user__username').annotate(max_score=Min('body')).order_by('max_score')[:3]
    # Funkce pro získání žebříčku podle data pro danou hru (posledních 10 záznamů)
    def get_leaderboard_all(game_name):
        return Score.objects.filter(hra=game_name).values('user__username').annotate(max_score=Min('body')).order_by('-date')[:10]
    # Získání žebříčků pro jednotlivé hry
    dobble_items = get_leaderboard_max('dobble')
    snake_items = get_leaderboard_max('had')
    mereni_items = get_leaderboard_min('mereni')
    dobble_items_all = get_leaderboard_all('dobble')
    snake_items_all = get_leaderboard_all('had')
    mereni_items_all = get_leaderboard_all('mereni')
    # Příprava kontextu pro šablonu
    context = {
        'dobble_items': dobble_items,
        'snake_items': snake_items,
        'mereni_items': mereni_items,
        'dobble_items_all' : dobble_items_all,
        'snake_items_all' : snake_items_all,
        'mereni_items_all' : mereni_items_all,
    }
    # Renderování šablony se skóre
    return render(request, 'score/score_list.html', context)

@require_POST
@login_required
def save_score(request):
        # Získání dat ze zaslaného JSON požadavku
        data = json.loads(request.body)
        score_value = data.get('score')
        game_name = data.get('hra')
        # Uložení skóre do databáze (user, skore, hra)
        Score.objects.create(
            user=request.user, 
            body=score_value,
            hra=game_name
        )
        
       