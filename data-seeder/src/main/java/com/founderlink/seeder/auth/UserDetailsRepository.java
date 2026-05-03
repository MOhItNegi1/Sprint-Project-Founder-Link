package com.founderlink.seeder.auth;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDetailsRepository extends JpaRepository<UserDetails, Long> {
    boolean existsByUserId(Long userId);
}
