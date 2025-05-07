package com.knu.cityapi.cityapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


@SpringBootApplication(
		exclude = {
				org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
		}
)
public class CityapiApplication {

	public static void main(String[] args) {
		SpringApplication.run(CityapiApplication.class, args);
	}

}
