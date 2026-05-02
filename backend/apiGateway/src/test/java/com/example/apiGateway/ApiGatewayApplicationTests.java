package com.example.apiGateway;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class ApiGatewayApplicationTests {

	@Test
	void applicationClassLoads() {
		assertNotNull(ApiGatewayApplication.class);
	}

}
