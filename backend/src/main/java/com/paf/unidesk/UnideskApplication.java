package com.paf.unidesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableJpaAuditing
public class UnideskApplication {

	public static void main(String[] args) {
		SpringApplication.run(UnideskApplication.class, args);
	}

}
