package com.example.notificationService.consumer;

import com.example.notificationService.dto.NotificationEvent;
import com.example.notificationService.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
@Slf4j
public class NotificationConsumer {
    private final NotificationService notificationService;

    @RabbitListener(queues = "notification.queue")
    public void consumeNotification(NotificationEvent notificationEvent){
        log.info(
                "Notification received for userId={}, title={}, type={}",
                notificationEvent.getUserId(),
                notificationEvent.getTitle(),
                notificationEvent.getType()
        );

        notificationService.createNotification(notificationEvent);
    }
}
