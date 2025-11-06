from decimal import Decimal
from django.db import models

TYPE_BOIS_CHOICES = [
    ('Chêne', 'Chêne'),
    ('Sapin', 'Sapin'),
    ('Iroko', 'Iroko'),
    ('Érable', 'Érable'),
    ('Acajou', 'Acajou'),
    ('Hêtre', 'Hêtre'),
    ('Bouleau', 'Bouleau'),
    ('Meranti', 'Meranti'),
    ('Teck', 'Teck'),
    ('Pin', 'Pin'),
]

EPAISEUR_BOIS_CHOICES = [
    (Decimal('5.0'), '5'),
    (Decimal('10.0'), '10'),
    (Decimal('15.0'), '15'),
    (Decimal('20.0'), '20'),
    (Decimal('25.0'), '25'),
    (Decimal('30.0'), '30'),
]

NOM_ARTICLE = [
    ('Table', 'Table'),
    ('Chaise', 'Chaise'),
    ('Armoire', 'Armoire'),
    ('Étagère', 'Étagère'),
    ('Bureau', 'Bureau'),
    ('Lit', 'Lit'),
    ('Commode', 'Commode'),
    ('Canapé', 'Canapé'),
    ('Meuble TV', 'Meuble TV'),
    ('Bibliothèque', 'Bibliothèque'),
]

class Client(models.Model):
    id = models.IntegerField(primary_key=True)  # tu fournis toi-même l'id
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    adresse = models.CharField(max_length=255, default="")
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=15)
    
    def __str__(self):
        return f"({self.id}{self.username}){self.prenom} {self.nom} ({self.email}) {self.telephone}) ({self.adresse})"

class Article(models.Model):
    nom = models.CharField("Nom de l'article", max_length=100, choices=NOM_ARTICLE)
    type = models.CharField("Type de bois", max_length=50, choices=TYPE_BOIS_CHOICES)
    epaisseur = models.DecimalField(
        "Épaisseur (mm)",
        max_digits=6,
        decimal_places=2,
        choices=EPAISEUR_BOIS_CHOICES,
        default=Decimal("5.0")
    )
    prix_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    prix_restant = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    valide = models.BooleanField(default=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    schema = models.TextField(blank=True, null=True)  # Champ pour stocker le schéma SVG
    # ✅ Dates automatiques
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.id} le {self.date_creation} et modifié le {self.date_modification} {self.type} {self.nom} ({self.epaisseur} mm) " \
               f"total {self.prix_total} DH, reste {self.prix_restant} DH"

class Mesure(models.Model):
    article = models.ForeignKey(Article, related_name='mesures', on_delete=models.CASCADE)
    longueur = models.DecimalField("Longueur (cm)", max_digits=8, decimal_places=2)
    largeur = models.DecimalField("Largeur (cm)", max_digits=8, decimal_places=2)
    nombre_de_fois = models.PositiveIntegerField("Nombre de fois", default=1)
    encadrement_droite = models.BooleanField(default=False)
    encadrement_gauche = models.BooleanField(default=False)
    encadrement_haut = models.BooleanField(default=False)
    encadrement_bas = models.BooleanField(default=False)

    def __str__(self):
        return f"ID {self.id} → {self.longueur} x {self.largeur} ({self.nombre_de_fois}x, " \
               f"D:{self.encadrement_droite} G:{self.encadrement_gauche} H:{self.encadrement_haut} B:{self.encadrement_bas})"

class Planche(models.Model):
    article = models.ForeignKey('article', on_delete=models.CASCADE, related_name='planches')
    longueur_initiale_mm = models.IntegerField()
    largeur_initiale_mm = models.IntegerField()

    def __str__(self):
        return f"({self.longueur_initiale_mm}x{self.largeur_initiale_mm}mm)"

class Piece(models.Model):
    planche = models.ForeignKey(Planche, on_delete=models.CASCADE, related_name='pieces')
    nom = models.CharField(max_length=100)
    longueur_desiree_mm = models.IntegerField()
    largeur_desiree_mm = models.IntegerField()
    quantite = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.nom} ({self.longueur_desiree_mm}x{self.largeur_desiree_mm}mm) x {self.quantite}"