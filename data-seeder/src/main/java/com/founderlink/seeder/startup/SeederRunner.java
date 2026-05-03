package com.founderlink.seeder.startup;

import com.founderlink.seeder.auth.Role;
import com.founderlink.seeder.auth.User;
import com.founderlink.seeder.auth.UserDetails;
import com.founderlink.seeder.auth.UserDetailsRepository;
import com.founderlink.seeder.auth.UserRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class SeederRunner implements CommandLineRunner {
    private final UserRepository userRepository;
    private final UserDetailsRepository userDetailsRepository;
    private final JdbcTemplate startupJdbcTemplate;
    private final JdbcTemplate investmentJdbcTemplate;
    private final JdbcTemplate notificationJdbcTemplate;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final String rawPassword;

    public SeederRunner(
            UserRepository userRepository,
            UserDetailsRepository userDetailsRepository,
            @Qualifier("startupJdbcTemplate") JdbcTemplate startupJdbcTemplate,
            @Qualifier("investmentJdbcTemplate") JdbcTemplate investmentJdbcTemplate,
            @Qualifier("notificationJdbcTemplate") JdbcTemplate notificationJdbcTemplate,
            @Value("${founderlink.seed.password}") String rawPassword
    ) {
        this.userRepository = userRepository;
        this.userDetailsRepository = userDetailsRepository;
        this.startupJdbcTemplate = startupJdbcTemplate;
        this.investmentJdbcTemplate = investmentJdbcTemplate;
        this.notificationJdbcTemplate = notificationJdbcTemplate;
        this.rawPassword = rawPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        System.out.println("Starting Founder Link seed data load...");

        List<User> founders = seedUsers(founderData());
        List<User> investors = seedUsers(investorData());
        List<Long> startupIds = seedStartups(founders);
        seedInvestments(founders, investors, startupIds);
        seedNotifications(founders, investors, startupIds);

        System.out.println("Seed complete.");
        System.out.println("Founder accounts: founder1@test.com to founder10@test.com");
        System.out.println("Investor accounts: investor1@test.com to investor5@test.com");
        System.out.println("Password for every seeded account: " + rawPassword);
    }

    private List<User> seedUsers(List<SeedData> people) {
        List<User> users = new ArrayList<>();
        for (SeedData person : people) {
            User user = userRepository.findByEmail(person.email()).orElseGet(() -> {
                User created = new User();
                created.setName(person.name());
                created.setEmail(person.email());
                created.setPassword(passwordEncoder.encode(rawPassword));
                created.setRole(person.role());
                created.setCreatedAt(LocalDateTime.now());
                created.setEnabled(true);
                return userRepository.save(created);
            });

            if (!userDetailsRepository.existsByUserId(user.getUserId())) {
                UserDetails details = new UserDetails();
                details.setUserId(user.getUserId());
                details.setName(person.name());
                details.setEmail(person.email());
                details.setRole(person.role());
                details.setSkills(person.skills());
                details.setExperience(person.experience());
                details.setBio(person.bio());
                details.setPortfolioLinks(person.portfolioLinks());
                details.setLocation(person.location());
                details.setCompanyName(person.companyName());
                details.setUpdatedAt(LocalDateTime.now());
                userDetailsRepository.save(details);
            }

            users.add(user);
        }
        return users;
    }

    private List<Long> seedStartups(List<User> founders) {
        List<StartupSeedData> startups = startupData();
        List<Long> startupIds = new ArrayList<>();

        for (int i = 0; i < founders.size(); i++) {
            User founder = founders.get(i);
            StartupSeedData seed = startups.get(i);

            Long existingId = queryLong(
                    startupJdbcTemplate,
                    "select startup_id from startups where founder_id = ? and startup_name = ? limit 1",
                    founder.getUserId(),
                    seed.startupName()
            );

            if (existingId != null) {
                startupIds.add(existingId);
                continue;
            }

            int seedIndex = i;
            KeyHolder keyHolder = new GeneratedKeyHolder();
            startupJdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement("""
                        insert into startups
                        (startup_name, description, industry, problem_statement, solution, funding_goal, stage, founder_id, location, approval_status, created_at, updated_at)
                        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, new String[]{"startup_id"});
                ps.setString(1, seed.startupName());
                ps.setString(2, seed.description());
                ps.setString(3, seed.industry());
                ps.setString(4, seed.problemStatement());
                ps.setString(5, seed.solution());
                ps.setDouble(6, seed.fundingGoal());
                ps.setString(7, seed.stage());
                ps.setLong(8, founder.getUserId());
                ps.setString(9, seed.location());
                ps.setString(10, seed.approvalStatus());
                ps.setObject(11, LocalDateTime.now().minusDays(20L - seedIndex));
                ps.setObject(12, LocalDateTime.now().minusDays(5L - Math.min(seedIndex, 4)));
                return ps;
            }, keyHolder);

            startupIds.add(Objects.requireNonNull(keyHolder.getKey()).longValue());
        }

        return startupIds;
    }

    private void seedInvestments(List<User> founders, List<User> investors, List<Long> startupIds) {
        String[] statuses = {"PENDING", "APPROVED", "REJECTED", "COMPLETED"};

        for (int startupIndex = 0; startupIndex < startupIds.size(); startupIndex++) {
            Long startupId = startupIds.get(startupIndex);
            Long founderId = founders.get(startupIndex).getUserId();

            int existingCount = queryInt(
                    investmentJdbcTemplate,
                    "select count(*) from investments where startup_id = ?",
                    startupId
            );
            if (existingCount >= 3) {
                continue;
            }

            for (int investmentIndex = existingCount; investmentIndex < 3; investmentIndex++) {
                User investor = investors.get((startupIndex + investmentIndex) % investors.size());
                double amount = 25000 + (startupIndex * 9000) + (investmentIndex * 15000);
                String status = statuses[(startupIndex + investmentIndex) % statuses.length];

                investmentJdbcTemplate.update("""
                        insert into investments
                        (startup_id, investor_id, founder_id, amount, status, created_at, updated_at)
                        values (?, ?, ?, ?, ?, ?, ?)
                        """,
                        startupId,
                        investor.getUserId(),
                        founderId,
                        amount,
                        status,
                        LocalDateTime.now().minusDays(12L - investmentIndex),
                        LocalDateTime.now().minusDays(3L)
                );
            }
        }
    }

    private void seedNotifications(List<User> founders, List<User> investors, List<Long> startupIds) {
        for (int i = 0; i < founders.size(); i++) {
            User founder = founders.get(i);
            String startupName = startupData().get(i).startupName();
            insertNotificationIfMissing(
                    founder.getUserId(),
                    "Startup activity",
                    "Your startup " + startupName + " has fresh investor activity.",
                    i % 3 == 0 ? "STARTUP_APPROVED" : "INVESTMENT_CREATED",
                    i % 2 == 0
            );
        }

        for (int i = 0; i < investors.size(); i++) {
            User investor = investors.get(i);
            String startupName = startupData().get(i).startupName();
            insertNotificationIfMissing(
                    investor.getUserId(),
                    "Investment update",
                    "Your investment request for " + startupName + " has been reviewed.",
                    i % 2 == 0 ? "INVESTMENT_APPROVED" : "INVESTMENT_REJECTED",
                    false
            );
        }
    }

    private void insertNotificationIfMissing(Long userId, String title, String message, String type, boolean read) {
        int existing = queryInt(
                notificationJdbcTemplate,
                "select count(*) from notifications where user_id = ? and title = ? and message = ?",
                userId,
                title,
                message
        );
        if (existing > 0) {
            return;
        }

        notificationJdbcTemplate.update("""
                insert into notifications
                (user_id, title, message, type, is_read, created_at)
                values (?, ?, ?, ?, ?, ?)
                """,
                userId,
                title,
                message,
                type,
                read,
                LocalDateTime.now().minusDays(userId % 7)
        );
    }

    private Long queryLong(JdbcTemplate jdbcTemplate, String sql, Object... args) {
        List<Long> values = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getLong(1), args);
        return values.isEmpty() ? null : values.get(0);
    }

    private int queryInt(JdbcTemplate jdbcTemplate, String sql, Object... args) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }

    private List<SeedData> founderData() {
        return List.of(
                new SeedData("Aarav Mehta", "founder1@test.com", Role.ROLE_FOUNDER, "Fintech, payments, B2B sales", "8 years building digital payment products", "Building financial rails for high-growth SMEs.", "https://founderlink.test/aarav", "Bengaluru", "LedgerFlow Labs"),
                new SeedData("Isha Kapoor", "founder2@test.com", Role.ROLE_FOUNDER, "Healthtech, AI triage, partnerships", "Former product lead at a hospital network", "Making primary care routing faster and more affordable.", "https://founderlink.test/isha", "Delhi NCR", "CareNest AI"),
                new SeedData("Kabir Rao", "founder3@test.com", Role.ROLE_FOUNDER, "Climate SaaS, carbon accounting, enterprise", "7 years in energy analytics", "Helping manufacturers measure and reduce emissions.", "https://founderlink.test/kabir", "Mumbai", "CarbonPilot"),
                new SeedData("Naina Shah", "founder4@test.com", Role.ROLE_FOUNDER, "Edtech, creator tools, community", "Scaled learning programs to 100k students", "Personalized skill tracks for college students.", "https://founderlink.test/naina", "Pune", "SkillForge"),
                new SeedData("Rohan Verma", "founder5@test.com", Role.ROLE_FOUNDER, "Logistics, route optimization, marketplaces", "Operations lead in last-mile delivery", "Modern logistics software for regional distributors.", "https://founderlink.test/rohan", "Hyderabad", "RouteMint"),
                new SeedData("Meera Nair", "founder6@test.com", Role.ROLE_FOUNDER, "AgriTech, supply chain, mobile apps", "Worked with FPOs across South India", "Demand forecasting and procurement tools for farmers.", "https://founderlink.test/meera", "Kochi", "AgriPulse"),
                new SeedData("Vivaan Sethi", "founder7@test.com", Role.ROLE_FOUNDER, "Cybersecurity, compliance, SaaS", "Security architect for regulated SaaS teams", "Continuous compliance monitoring for startups.", "https://founderlink.test/vivaan", "Gurugram", "TrustLayer"),
                new SeedData("Anaya Reddy", "founder8@test.com", Role.ROLE_FOUNDER, "HR tech, payroll, analytics", "Built people ops systems for distributed teams", "Payroll and workforce insights for modern teams.", "https://founderlink.test/anaya", "Chennai", "PeopleGrid"),
                new SeedData("Dev Malhotra", "founder9@test.com", Role.ROLE_FOUNDER, "Retail tech, inventory, analytics", "Retail analytics consultant", "Inventory intelligence for omnichannel stores.", "https://founderlink.test/dev", "Jaipur", "StockWise"),
                new SeedData("Tara Bansal", "founder10@test.com", Role.ROLE_FOUNDER, "LegalTech, contracts, workflow automation", "Corporate lawyer turned product founder", "Contract lifecycle automation for SMBs.", "https://founderlink.test/tara", "Ahmedabad", "ClauseCraft")
        );
    }

    private List<SeedData> investorData() {
        return List.of(
                new SeedData("Arjun Capital", "investor1@test.com", Role.ROLE_INVESTOR, "Seed investing, fintech, SaaS", "Angel syndicate with 40 portfolio companies", "Invests in sharp teams solving operational pain.", "https://founderlink.test/arjun-capital", "Mumbai", "Arjun Capital"),
                new SeedData("Priya Ventures", "investor2@test.com", Role.ROLE_INVESTOR, "Healthtech, edtech, marketplaces", "Early-stage VC investor", "Backing founders with strong distribution insight.", "https://founderlink.test/priya-ventures", "Bengaluru", "Priya Ventures"),
                new SeedData("Northstar Angels", "investor3@test.com", Role.ROLE_INVESTOR, "Climate, logistics, supply chain", "Operator-led angel group", "Supports founders with GTM and hiring help.", "https://founderlink.test/northstar", "Delhi NCR", "Northstar Angels"),
                new SeedData("BluePeak Fund", "investor4@test.com", Role.ROLE_INVESTOR, "Enterprise SaaS, cybersecurity, AI", "Micro VC focused on B2B software", "Looks for durable revenue and low churn.", "https://founderlink.test/bluepeak", "Pune", "BluePeak Fund"),
                new SeedData("Sage Bridge Partners", "investor5@test.com", Role.ROLE_INVESTOR, "Legaltech, HR tech, retail", "Family office investment desk", "Long-term capital for category-defining companies.", "https://founderlink.test/sagebridge", "Hyderabad", "Sage Bridge Partners")
        );
    }

    private List<StartupSeedData> startupData() {
        return List.of(
                new StartupSeedData("LedgerFlow Labs", "Embedded working-capital workflows for SMEs.", "FinTech", "Small businesses struggle to access credit at invoice time.", "Connect bank, invoice, and underwriting data in one flow.", 50000, "MVP", "Bengaluru", "APPROVED"),
                new StartupSeedData("CareNest AI", "AI assisted patient intake for clinics.", "HealthTech", "Clinics lose time on manual triage.", "Automated intake, routing, and care summaries.", 75000, "EARLY_TRACTION", "Delhi NCR", "APPROVED"),
                new StartupSeedData("CarbonPilot", "Carbon reporting for manufacturing teams.", "ClimateTech", "Emission data lives in disconnected spreadsheets.", "Automated facility-level carbon dashboards.", 120000, "SCALING", "Mumbai", "APPROVED"),
                new StartupSeedData("SkillForge", "Career skill paths for college students.", "EdTech", "Students lack structured employability guidance.", "Adaptive project-based learning and mentor feedback.", 65000, "MVP", "Pune", "PENDING"),
                new StartupSeedData("RouteMint", "Regional distributor route intelligence.", "Logistics", "Regional distributors run inefficient delivery routes.", "Route planning using demand and delivery constraints.", 90000, "EARLY_TRACTION", "Hyderabad", "APPROVED"),
                new StartupSeedData("AgriPulse", "Procurement planning for farmer collectives.", "AgriTech", "Farm supply is hard to forecast before procurement.", "Mobile-first demand prediction and buyer matching.", 70000, "IDEA", "Kochi", "PENDING"),
                new StartupSeedData("TrustLayer", "Continuous compliance for SaaS companies.", "Cybersecurity", "Compliance evidence collection is slow and manual.", "Policy, evidence, and audit workflows in one workspace.", 110000, "MVP", "Gurugram", "APPROVED"),
                new StartupSeedData("PeopleGrid", "Payroll intelligence for distributed teams.", "HRTech", "Payroll teams lack real-time workforce cost insight.", "Automated payroll analytics and exception alerts.", 85000, "EARLY_TRACTION", "Chennai", "APPROVED"),
                new StartupSeedData("StockWise", "Inventory intelligence for omnichannel retail.", "RetailTech", "Retailers overstock fast and understock winners.", "Demand forecasting across online and offline stores.", 60000, "MVP", "Jaipur", "REJECTED"),
                new StartupSeedData("ClauseCraft", "Contract lifecycle automation for SMBs.", "LegalTech", "Small teams lose time on repetitive contract work.", "Template generation, approvals, and renewal tracking.", 95000, "EARLY_TRACTION", "Ahmedabad", "APPROVED")
        );
    }
}
