package com.founderlink.seeder.startup;

public record StartupSeedData(
        String startupName,
        String description,
        String industry,
        String problemStatement,
        String solution,
        double fundingGoal,
        String stage,
        String location,
        String approvalStatus
) {
}
