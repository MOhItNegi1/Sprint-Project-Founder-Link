import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import {
  InvestmentCreateRequest,
  InvestmentResponse,
  NotificationResponse,
  PageResponse,
  StartupCreateRequest,
  StartupResponse,
  StartupUpdateRequest,
  UserResponse,
  UserUpdateRequest
} from '../models/portal.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getUser(id: number) {
    return this.http.get<UserResponse>(`/users/getUser/${id}`);
  }

  updateUser(id: number, request: UserUpdateRequest) {
    return this.http.put<UserResponse>(`/users/updateProfile/${id}`, request);
  }

  getUsers(page = 0, size = 50) {
    return this.http
      .get<PageResponse<UserResponse>>('/users/getUsersPage', { params: this.pageParams(page, size, 'userId') })
      .pipe(map((response) => response.listContent ?? []));
  }

  getStartups(page = 0, size = 50) {
    return this.http
      .get<PageResponse<StartupResponse>>('/startups/getAllStartups', {
        params: this.pageParams(page, size, 'startupId', 'desc')
      })
      .pipe(map((response) => response.listContent ?? []));
  }

  getStartup(id: number) {
    return this.http.get<StartupResponse>(`/startups/getStartupById/${id}`);
  }

  createStartup(request: StartupCreateRequest) {
    return this.http.post<StartupResponse>('/startups/createStartup', request);
  }

  updateStartup(id: number, request: StartupUpdateRequest) {
    return this.http.put<StartupResponse>(`/startups/updateStartUp/${id}`, request);
  }

  deleteStartup(id: number) {
    return this.http.delete(`/startups/deleteStartup/${id}`, { responseType: 'text' });
  }

  approveStartup(id: number) {
    return this.http.put<StartupResponse>(`/startups/admin/approve/${id}`, {});
  }

  rejectStartup(id: number) {
    return this.http.put<StartupResponse>(`/startups/admin/reject/${id}`, {});
  }

  createInvestment(request: InvestmentCreateRequest) {
    return this.http.post<InvestmentResponse>('/investments/createInvestment', request);
  }

  approveInvestment(id: number) {
    return this.http.put<InvestmentResponse>(`/investments/approve/${id}`, {});
  }

  rejectInvestment(id: number) {
    return this.http.put<InvestmentResponse>(`/investments/reject/${id}`, {});
  }

  completeInvestment(id: number) {
    return this.http.put<InvestmentResponse>(`/investments/complete/${id}`, {});
  }

  getInvestmentsByStartup(startupId: number) {
    return this.http.get<InvestmentResponse[]>(`/investments/getByStartup/${startupId}`);
  }

  getMyInvestments() {
    return this.http.get<InvestmentResponse[]>('/investments/getMyInvestments');
  }

  getNotifications(userId: number) {
    return this.http.get<NotificationResponse[]>(`/notifications/getUserNotifications/${userId}`);
  }

  markNotificationAsRead(notificationId: number) {
    return this.http.put<NotificationResponse>(`/notifications/markAsRead/${notificationId}`, {});
  }

  deleteNotification(notificationId: number) {
    return this.http.delete<void>(`/notifications/delete/${notificationId}`);
  }

  private pageParams(page: number, size: number, sortBy: string, direction: 'asc' | 'desc' = 'asc') {
    return new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);
  }
}
