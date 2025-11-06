from django import forms
from .models import Planche, Piece
from django.forms import inlineformset_factory

class PlancheForm(forms.ModelForm):
    class Meta:
        model = Planche
        fields = ['nom', 'longueur_initiale_mm', 'largeur_initiale_mm', 'epaisseur_trait_scie_mm']

class PieceForm(forms.ModelForm):
    class Meta:
        model = Piece
        fields = ['nom', 'longueur_desiree_mm', 'largeur_desiree_mm', 'quantite']

# Vous pourriez utiliser un Formset pour ajouter plusieurs pièces à la fois.
PieceFormSet = inlineformset_factory(Planche, Piece, form=PieceForm, extra=1, can_delete=True)
