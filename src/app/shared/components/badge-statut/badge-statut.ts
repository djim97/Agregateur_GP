import { ChangeDetectionStrategy, Component,input, computed } from '@angular/core';

export type StatutBadge =
  | 'EN_ATTENTE' | 'EN_COURS' | 'COMPLET'
  | 'CONFIRME' | 'ANNULE' | 'LIVRE';

interface BadgeConfig {
  label: string;
  variant: 'warn' | 'info' | 'ok' | 'danger';
}

const STATUT_MAP: Record<StatutBadge, BadgeConfig> = {
  EN_ATTENTE: { label: 'En attente', variant: 'warn' },
  EN_COURS:   { label: 'En cours',   variant: 'info' },
  COMPLET:    { label: 'Complet',    variant: 'warn' },
  CONFIRME:   { label: 'Confirmé',   variant: 'ok' },
  ANNULE:     { label: 'Annulé',     variant: 'danger' },
  LIVRE:      { label: 'Livré',      variant: 'ok' },
};

@Component({
  selector: 'app-badge-statut',
  imports: [],
  templateUrl: './badge-statut.html',
  styleUrl: './badge-statut.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeStatut {
  statut = input.required<StatutBadge>();

  protected readonly config = computed<BadgeConfig>(
    () => STATUT_MAP[this.statut()]
  );
}
