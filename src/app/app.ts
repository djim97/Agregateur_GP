import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toasts } from './shared/components/toasts/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts],   // ← Toasts ajouté ici
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}