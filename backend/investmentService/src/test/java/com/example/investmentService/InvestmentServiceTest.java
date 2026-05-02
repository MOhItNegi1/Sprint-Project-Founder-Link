package com.example.investmentService;

import com.example.investmentService.dto.InvestmentCreateRequest;
import com.example.investmentService.dto.InvestmentResponse;
import com.example.investmentService.dto.StartupResponse;
import com.example.investmentService.dto.UserResponse;
import com.example.investmentService.entity.Investment;
import com.example.investmentService.enums.ApprovalStatus;
import com.example.investmentService.enums.InvestmentStatus;
import com.example.investmentService.enums.Role;
import com.example.investmentService.exception.InvalidStartupStateException;
import com.example.investmentService.exception.InvestmentNotFoundException;
import com.example.investmentService.exception.UnauthorizedException;
import com.example.investmentService.feign.StartupClient;
import com.example.investmentService.feign.UserClient;
import com.example.investmentService.producer.NotificationProducer;
import com.example.investmentService.repository.InvestmentRepository;
import com.example.investmentService.service.InvestmentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.modelmapper.ModelMapper;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvestmentServiceTest {
    @Mock
    private InvestmentRepository investmentRepository;

    @Mock
    private UserClient userClient;

    @Mock
    private StartupClient startupClient;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private NotificationProducer notificationProducer;

    @InjectMocks
    private InvestmentService investmentService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createInvestmentPersistsApprovedStartupInvestment() {
        authenticateAs(10L);
        InvestmentCreateRequest request = new InvestmentCreateRequest(3L, 5000.0);
        UserResponse investor = new UserResponse(10L, "Investor", "investor@example.com", Role.ROLE_INVESTOR);
        StartupResponse startup = new StartupResponse(3L, "Acme", 100000.0, 20L, null, ApprovalStatus.APPROVED);
        Investment saved = investment(99L, 3L, 10L, 20L, InvestmentStatus.PENDING);
        InvestmentResponse response = new InvestmentResponse();
        response.setInvestmentId(99L);

        when(userClient.getUserById(10L)).thenReturn(investor);
        when(startupClient.getStartupById(3L)).thenReturn(startup);
        when(investmentRepository.save(any(Investment.class))).thenReturn(saved);
        doReturn(response).when(modelMapper).map(saved, InvestmentResponse.class);

        InvestmentResponse result = investmentService.createInvestment(request);

        assertEquals(99L, result.getInvestmentId());
        assertEquals("Investment created successfully", result.getMessage());
        verify(notificationProducer).sendNotification(any());
    }

    @Test
    void createInvestmentRejectsNonInvestor() {
        authenticateAs(10L);
        when(userClient.getUserById(10L)).thenReturn(new UserResponse(10L, "Founder", "founder@example.com", Role.ROLE_FOUNDER));

        assertThrows(UnauthorizedException.class,
                () -> investmentService.createInvestment(new InvestmentCreateRequest(3L, 5000.0)));
    }

    @Test
    void createInvestmentRejectsUnapprovedStartup() {
        authenticateAs(10L);
        when(userClient.getUserById(10L)).thenReturn(new UserResponse(10L, "Investor", "investor@example.com", Role.ROLE_INVESTOR));
        when(startupClient.getStartupById(3L)).thenReturn(new StartupResponse(3L, "Acme", 100000.0, 20L, null, ApprovalStatus.PENDING));

        assertThrows(InvalidStartupStateException.class,
                () -> investmentService.createInvestment(new InvestmentCreateRequest(3L, 5000.0)));
    }

    @Test
    void approveInvestmentUpdatesOwnedInvestment() {
        authenticateAs(20L);
        Investment investment = investment(99L, 3L, 10L, 20L, InvestmentStatus.PENDING);
        InvestmentResponse response = new InvestmentResponse();
        response.setInvestmentId(99L);
        when(investmentRepository.findById(99L)).thenReturn(Optional.of(investment));
        when(investmentRepository.save(investment)).thenReturn(investment);
        doReturn(response).when(modelMapper).map(investment, InvestmentResponse.class);

        InvestmentResponse result = investmentService.approveInvestment(99L);

        assertEquals(InvestmentStatus.APPROVED, investment.getStatus());
        assertEquals("Investment approved", result.getMessage());
        verify(notificationProducer).sendNotification(any());
    }

    @Test
    void rejectInvestmentRequiresFounderOwner() {
        authenticateAs(21L);
        when(investmentRepository.findById(99L)).thenReturn(Optional.of(investment(99L, 3L, 10L, 20L, InvestmentStatus.PENDING)));

        assertThrows(UnauthorizedException.class, () -> investmentService.rejectInvestment(99L));
    }

    @Test
    void completeInvestmentRequiresApprovedStatus() {
        authenticateAs(20L);
        when(investmentRepository.findById(99L)).thenReturn(Optional.of(investment(99L, 3L, 10L, 20L, InvestmentStatus.PENDING)));

        assertThrows(RuntimeException.class, () -> investmentService.completeInvestment(99L));
    }

    @Test
    void completeInvestmentUpdatesApprovedInvestment() {
        authenticateAs(20L);
        Investment investment = investment(99L, 3L, 10L, 20L, InvestmentStatus.APPROVED);
        InvestmentResponse response = new InvestmentResponse();
        when(investmentRepository.findById(99L)).thenReturn(Optional.of(investment));
        when(investmentRepository.save(investment)).thenReturn(investment);
        doReturn(response).when(modelMapper).map(investment, InvestmentResponse.class);

        InvestmentResponse result = investmentService.completeInvestment(99L);

        assertNotNull(result);
        assertEquals(InvestmentStatus.COMPLETED, investment.getStatus());
        assertEquals("Investment completed", result.getMessage());
    }

    @Test
    void getInvestmentsByStartupRequiresStartupFounder() {
        authenticateAs(20L);
        StartupResponse startup = new StartupResponse(3L, "Acme", 100000.0, 20L, null, ApprovalStatus.APPROVED);
        Investment investment = investment(99L, 3L, 10L, 20L, InvestmentStatus.APPROVED);
        InvestmentResponse response = new InvestmentResponse();
        when(startupClient.getStartupById(3L)).thenReturn(startup);
        when(investmentRepository.findByStartupId(3L)).thenReturn(List.of(investment));
        doReturn(response).when(modelMapper).map(investment, InvestmentResponse.class);

        List<InvestmentResponse> result = investmentService.getInvestmentsByStartup(3L);

        assertEquals(1, result.size());
    }

    @Test
    void getMyInvestmentsReturnsCurrentInvestorInvestments() {
        authenticateAs(10L);
        Investment investment = investment(99L, 3L, 10L, 20L, InvestmentStatus.APPROVED);
        InvestmentResponse response = new InvestmentResponse();
        response.setInvestmentId(99L);
        when(investmentRepository.findByInvestorId(10L)).thenReturn(List.of(investment));
        doReturn(response).when(modelMapper).map(investment, InvestmentResponse.class);

        List<InvestmentResponse> result = investmentService.getMyInvestments();

        assertEquals(1, result.size());
        assertEquals(99L, result.get(0).getInvestmentId());
    }

    @Test
    void approveInvestmentThrowsWhenMissing() {
        when(investmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(InvestmentNotFoundException.class, () -> investmentService.approveInvestment(99L));
    }

    private void authenticateAs(Long userId) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, null));
    }

    private Investment investment(Long id, Long startupId, Long investorId, Long founderId, InvestmentStatus status) {
        Investment investment = new Investment();
        investment.setInvestmentId(id);
        investment.setStartupId(startupId);
        investment.setInvestorId(investorId);
        investment.setFounderId(founderId);
        investment.setAmount(5000.0);
        investment.setStatus(status);
        return investment;
    }
}
