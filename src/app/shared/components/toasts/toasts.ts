import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Notifications } from '../../../core/services/notifications';

@Component({
  selector: 'app-toasts',
  imports: [],
  templateUrl: './toasts.html',
  styleUrl: './toasts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toasts {
  readonly notifications = inject(Notifications);
}