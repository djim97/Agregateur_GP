import { ChangeDetectionStrategy, Component,input, output } from '@angular/core';

@Component({
  selector: 'app-etat-vide',
  imports: [],
  templateUrl: './etat-vide.html',
  styleUrl: './etat-vide.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EtatVide {
  message = input.required<string>();
  labelAction = input<string>();
  actionCliquee = output<void>();

}
