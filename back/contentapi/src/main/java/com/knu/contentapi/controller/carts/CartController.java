package com.knu.contentapi.controller.carts;


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

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000") //나중에 배포시 삭제
@RestController
@RequiredArgsConstructor
@RequestMapping("/carts")
@Slf4j

public class CartController {
    final private CartService cartService;

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

    /**장바구니 항목삭제*/
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCart (@PathVariable  Long id) {
        cartService.deleteCart(id);
        return ResponseEntity.noContent().build();
    }
}
