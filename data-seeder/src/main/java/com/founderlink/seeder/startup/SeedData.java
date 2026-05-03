package com.founderlink.seeder.startup;

import com.founderlink.seeder.auth.Role;

public record SeedData(
        String name,
        String email,
        Role role,
        String skills,
        String experience,
        String bio,
        String portfolioLinks,
        String location,
        String companyName
) {
}
