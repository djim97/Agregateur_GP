import { ChangeDetectionStrategy, Component, input} from '@angular/core';

export type EtatEtape = 'fait' | 'en-cours' | 'a-venir';
@Component({
  selector: 'app-etape-timeline',
  imports: [],
  templateUrl: './etape-timeline.html',
  styleUrl: './etape-timeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EtapeTimeline {
  etat = input.required<EtatEtape>();
  label = input.required<string>();
  sousTexte = input<string>();
  numero = input<number>();
}
