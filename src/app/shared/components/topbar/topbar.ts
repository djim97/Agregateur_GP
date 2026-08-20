import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth'; 
import { PATHS } from '../../../app.paths';


@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush, 
})
export class Topbar {
  protected readonly auth = inject(Auth);
  protected readonly paths = PATHS;
}
