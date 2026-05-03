package com.example.notificationService.service;

import com.example.notificationService.dto.NotificationEvent;
import com.example.notificationService.dto.NotificationResponse;
import com.example.notificationService.entity.Notification;
import com.example.notificationService.enums.NotificationType;
import com.example.notificationService.exception.UnauthorizedException;
import com.example.notificationService.repository.NotificationRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.modelmapper.ModelMapper;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {
    @Mock
    private NotificationRepository notificationRepository;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, new ModelMapper());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createNotificationPersistsEventDetails() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));
        NotificationEvent event = new NotificationEvent(7L, "Welcome", "You have a new alert", NotificationType.STARTUP_CREATED);

        notificationService.createNotification(event);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertEquals(7L, saved.getUserId());
        assertEquals("Welcome", saved.getTitle());
        assertEquals("You have a new alert", saved.getMessage());
        assertEquals(NotificationType.STARTUP_CREATED, saved.getType());
        assertFalse(saved.isRead());
    }

    @Test
    void getUserNotificationsReturnsOnlyForTokenOwner() {
        authenticateAs(7L);
        Notification notification = new Notification();
        notification.setNotificationId(11L);
        notification.setUserId(7L);
        notification.setTitle("Title");
        notification.setMessage("Message");
        notification.setType(NotificationType.STARTUP_APPROVED);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(7L)).thenReturn(List.of(notification));

        List<NotificationResponse> responses = notificationService.getUserNotificationsById(7L);

        assertEquals(1, responses.size());
        assertEquals(11L, responses.get(0).getNotificationId());
        assertEquals("Title", responses.get(0).getTitle());
    }

    @Test
    void getUserNotificationsRejectsDifferentUser() {
        authenticateAs(7L);

        assertThrows(UnauthorizedException.class, () -> notificationService.getUserNotificationsById(9L));
    }

    @Test
    void markAsReadUpdatesOwnedNotification() {
        authenticateAs(7L);
        Notification notification = new Notification();
        notification.setNotificationId(11L);
        notification.setUserId(7L);
        when(notificationRepository.findById(11L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(notification)).thenReturn(notification);

        NotificationResponse response = notificationService.markAsRead(11L);

        assertTrue(notification.isRead());
        assertTrue(response.isRead());
    }

    @Test
    void deleteNotificationDeletesOwnedNotification() {
        authenticateAs(7L);
        Notification notification = new Notification();
        notification.setNotificationId(11L);
        notification.setUserId(7L);
        when(notificationRepository.findById(11L)).thenReturn(Optional.of(notification));

        notificationService.deleteNotification(11L);

        verify(notificationRepository).delete(notification);
    }

    @Test
    void deleteNotificationRejectsDifferentUser() {
        authenticateAs(7L);
        Notification notification = new Notification();
        notification.setNotificationId(11L);
        notification.setUserId(9L);
        when(notificationRepository.findById(11L)).thenReturn(Optional.of(notification));

        assertThrows(UnauthorizedException.class, () -> notificationService.deleteNotification(11L));
        verify(notificationRepository, never()).delete(notification);
    }

    private void authenticateAs(Long userId) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, null));
    }
}
