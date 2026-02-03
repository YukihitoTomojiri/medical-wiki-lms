package com.medical.wiki.dto;

import com.medical.wiki.entity.Department;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentDto {
    private Long id;
    private String name;
    private Long facilityId;
    private String facilityName;

    public static DepartmentDto from(Department department) {
        return DepartmentDto.builder()
                .id(department.getId())
                .name(department.getName())
                .facilityId(department.getFacility().getId())
                .facilityName(department.getFacility().getName())
                .build();
    }
}
