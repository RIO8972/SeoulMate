package com.knu.contentapi.service.carts;

import com.knu.contentapi.domain.carts.Cart;
import com.knu.contentapi.domain.carts.CartRepository;
import com.knu.contentapi.domain.users.User;
import com.knu.contentapi.dto.cart.CartResponseDto;
import com.knu.contentapi.dto.places.PlaceRequestDto;
import com.knu.contentapi.dto.places.PlaceResponseDto;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;


@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CartService {
    final private  CartRepository cartRepository;

    public List<CartResponseDto> getUserCarts(User user) {
        List<Cart> carts = cartRepository.findAllByUser_Id(user.getId());
        return carts.stream()
                .map(c -> CartResponseDto.builder()
                        .id(c.getId())
                        .placeId(c.getPlaceId())
                        .name(c.getName())
                        // lat/lng 가 String 이면 파싱 (널/빈 대비)
                        .lat(c.getLat())
                        .lng(c.getLng())
                        .address(c.getAddress())
                        .url(c.getUrl())
                        .category(c.getCategory())
                        .build())
                .toList();
    }

    public Long createCart(PlaceRequestDto dto, User user) {
        Cart cart = Cart.builder()
                .user(user)
                .placeId(dto.getPlaceId())
                .name(dto.getName())
                .lat(dto.getLat())
                .lng(dto.getLng())
                .address(dto.getAddress())
                .url(dto.getUrl())
                .build();
        log.info(cart.toString());
        return cartRepository.save(cart).getId();
    }

    public void createReviewPlaces(List<PlaceRequestDto> dtos, User user) {
        dtos.stream()
                .map(requestDto -> createCart(requestDto, user))
                .toList();
    }

    public void deleteCart(Long id) {
        cartRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "course not found: " + id));
        cartRepository.deleteById(id);
    }

    public void deleteCartByPlaceId(String placeId, User user) {
        cartRepository.deleteByUser_IdAndPlaceId(user.getId(),placeId);
    }

    //행사 장소용
    public void deleteCartByName(String name, User user) {
        cartRepository.deleteByUser_IdAndName(user.getId(), name);
    }
}