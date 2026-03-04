package com.paf.unidesk.dto.request;

import com.paf.unidesk.enums.UserType;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private UserType userType;
}