package com.knu.contentapi.dto.review;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SliceResponse<T> {
    private List<T> items;
    private String nextCursor;   // "createdAt_id" 형태
    private boolean hasNext;
}
