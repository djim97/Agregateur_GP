import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Transporteurs } from '../../../core/services/transporteurs';
import { Transporteur } from '../../../models/transporteur.model';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EtatVide } from '../../../shared/components/etat-vide/etat-vide';
import { PATHS } from '../../../app.paths';

@Component({
  selector: 'app-annuaire',
  imports: [RouterLink, Spinner, EtatVide],
  templateUrl: './annuaire.html',
  styleUrl: './annuaire.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Annuaire {
  private transporteursService = inject(Transporteurs);
  protected readonly paths = PATHS;

  protected readonly transporteurs = signal<Transporteur[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly recherche = signal('');
  protected readonly zone = signal('');

  protected readonly transporteursFiltres = computed(() => {
    const zoneChoisie = this.zone().trim().toLowerCase();
    if (!zoneChoisie) return this.transporteurs();
    return this.transporteurs().filter(t =>
      t.zonesDesservies.some(z => z.toLowerCase() === zoneChoisie)
    );
  });

  protected readonly zonesDisponibles = computed(() => {
    const zones = new Set<string>();
    this.transporteurs().forEach(t => t.zonesDesservies.forEach(z => zones.add(z)));
    return Array.from(zones).sort();
  });

  constructor() {
    this.charger();
  }

  protected onRecherche(valeur: string): void {
    this.recherche.set(valeur);
    this.charger();
  }

  protected onZone(valeur: string): void {
    this.zone.set(valeur);
  }

  private charger(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const requete = this.recherche().trim()
      ? this.transporteursService.search(this.recherche().trim())
      : this.transporteursService.getAll();

    requete.subscribe({
      next: (data) => {
        this.transporteurs.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les transporteurs.');
        this.isLoading.set(false);
      },
    });
  }
}