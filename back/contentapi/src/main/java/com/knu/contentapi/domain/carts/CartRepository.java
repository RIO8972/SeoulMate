package com.knu.contentapi.domain.carts;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface CartRepository extends JpaRepository<Cart, Long> {
    List<Cart> findAllByUser_Id(Long userId);

    @Query("select c.placeId from Cart c where c.user.id = :userId and c.placeId in :ids")
    List<String> findPlaceIdsInCart(@Param("userId") Long userId,
                                    @Param("ids") Collection<String> ids);
    // 해당 userId의 장바구니에서 placeId 한 건 삭제 (unique (user_id, place_id)라면 최대 1건)
    long deleteByUser_IdAndPlaceId(Long userId, String placeId);

    //이름으로 존재여부 배치 조회
    @Query("select c.name from Cart c where c.user.id = :userId and c.name in :names")
    List<String> findNamesInCart(@Param("userId") Long userId,
                                 @Param("names") Collection<String> names);
    //이름으로 삭제 (유저 스코프)
    long deleteByUser_IdAndName(Long userId, String name);

}
