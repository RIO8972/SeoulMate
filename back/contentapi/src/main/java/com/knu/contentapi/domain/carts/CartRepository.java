package com.knu.contentapi.domain.carts;


import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CartRepository extends JpaRepository<Cart, Long> {
    List<Cart> findAllByUser_Id(Long userId);
}
