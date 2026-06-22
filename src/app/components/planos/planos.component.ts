import { Component } from '@angular/core';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { PlanCatalogComponent } from './plan-catalog.component';

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [AppHeaderComponent, PlanCatalogComponent],
  templateUrl: './planos.component.html',
  styleUrl: './planos.component.scss'
})
export class PlanosComponent {}
