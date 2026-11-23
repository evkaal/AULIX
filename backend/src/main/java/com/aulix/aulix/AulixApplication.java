package com.aulix.aulix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AulixApplication {

    public static void main(String[] args) {
        SpringApplication.run(AulixApplication.class, args);
    }
}
