package com.example.startupService;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class StartupServiceApplicationTests {

	@Test
	void applicationClassLoads() {
		assertNotNull(StartupServiceApplication.class);
	}

}
