import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-conta-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppHeaderComponent],
  templateUrl: './conta-shell.component.html',
  styleUrl: './conta-shell.component.scss'
})
export class ContaShellComponent {}
