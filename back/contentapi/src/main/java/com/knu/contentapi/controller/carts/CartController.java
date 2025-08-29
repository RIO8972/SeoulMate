package com.knu.contentapi.controller.carts;


import com.knu.contentapi.domain.carts.CartRepository;
import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.dto.course.CourseRequestDto;
import com.knu.contentapi.dto.places.PlaceRequestDto;
import com.knu.contentapi.dto.places.PlaceResponseDto;
import com.knu.contentapi.service.carts.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@RestController
@RequiredArgsConstructor
@RequestMapping("/carts")
@Slf4j

public class CartController {
    final private CartService cartService;
    final private CartRepository cartRepository;

    /**내 장바구니 목록*/
    @GetMapping("/mine")
    public ResponseEntity<List<PlaceResponseDto>> getUserCarts(
            @AuthenticationPrincipal User user ) {
        return ResponseEntity.ok(cartService.getUserCarts(user));
    }

    /**장바구니에 추가*/
    @PostMapping
    public ResponseEntity<?> createCart(
            @AuthenticationPrincipal User user,
            @RequestBody PlaceRequestDto dto

    ) {
        log.info(dto.toString());
        cartService.createCart(dto, user);
        return ResponseEntity.ok("");
    }

    /**장바구니에 추가*/
    @PostMapping("/places")
    public ResponseEntity<?> getReviewPlaces(
            @AuthenticationPrincipal User user,
            @RequestBody List<PlaceRequestDto> dtos

    ) {
        //중복일때는? placeId로 식별해서 추가x (추가예정)
        log.info(dtos.toString());
        cartService.createReviewPlaces(dtos, user);
        return ResponseEntity.ok("코스장소 저장 성공");
    }

    /**장바구니 항목삭제*/
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCart (@PathVariable  Long id) {
        cartService.deleteCart(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/check")
    public Map<String, Boolean> check(@AuthenticationPrincipal User user,
                                      @RequestBody List<String> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();
        var inCart = new HashSet<>(cartRepository.findPlaceIdsInCart(user.getId(), ids));
        return ids.stream().collect(Collectors.toMap(id -> id, inCart::contains));
    }
}
