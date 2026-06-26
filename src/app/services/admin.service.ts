import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminOverview,
  AdminUserDetail,
  AdminUsersPage
} from '../models/admin.model';
import { SubscriptionPlan } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  getOverview(days: number): Observable<AdminOverview> {
    const params = new HttpParams().set('days', String(days));
    return this.http.get<AdminOverview>(`${this.baseUrl}/overview`, { params });
  }

  listUsers(options: {
    page?: number;
    size?: number;
    plan?: SubscriptionPlan | '';
    q?: string;
  } = {}): Observable<AdminUsersPage> {
    let params = new HttpParams()
      .set('page', String(options.page ?? 0))
      .set('size', String(options.size ?? 20));

    if (options.plan) {
      params = params.set('plan', options.plan);
    }
    if (options.q?.trim()) {
      params = params.set('q', options.q.trim());
    }

    return this.http.get<AdminUsersPage>(`${this.baseUrl}/users`, { params });
  }

  getUserDetail(id: string): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`${this.baseUrl}/users/${id}`);
  }
}
