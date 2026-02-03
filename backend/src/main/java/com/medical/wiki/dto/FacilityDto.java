package com.medical.wiki.dto;

import com.medical.wiki.entity.Facility;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityDto {
    private Long id;
    private String name;

    public static FacilityDto from(Facility facility) {
        return FacilityDto.builder()
                .id(facility.getId())
                .name(facility.getName())
                .build();
    }
}
