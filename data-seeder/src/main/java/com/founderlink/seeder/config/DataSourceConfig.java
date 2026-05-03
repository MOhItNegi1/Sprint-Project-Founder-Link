package com.founderlink.seeder.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {
    @Bean
    JdbcTemplate startupJdbcTemplate(
            @Value("${founderlink.datasource.startup.url}") String url,
            @Value("${founderlink.datasource.username}") String username,
            @Value("${founderlink.datasource.password}") String password
    ) {
        return new JdbcTemplate(dataSource(url, username, password));
    }

    @Bean
    JdbcTemplate investmentJdbcTemplate(
            @Value("${founderlink.datasource.investment.url}") String url,
            @Value("${founderlink.datasource.username}") String username,
            @Value("${founderlink.datasource.password}") String password
    ) {
        return new JdbcTemplate(dataSource(url, username, password));
    }

    @Bean
    JdbcTemplate notificationJdbcTemplate(
            @Value("${founderlink.datasource.notification.url}") String url,
            @Value("${founderlink.datasource.username}") String username,
            @Value("${founderlink.datasource.password}") String password
    ) {
        return new JdbcTemplate(dataSource(url, username, password));
    }

    private DataSource dataSource(String url, String username, String password) {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        return dataSource;
    }
}
