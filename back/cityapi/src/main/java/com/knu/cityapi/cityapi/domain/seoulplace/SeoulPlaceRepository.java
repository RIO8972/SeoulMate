package com.knu.cityapi.cityapi.domain.seoulplace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SeoulPlaceRepository extends JpaRepository<SeoulPlace, Long> {
    Optional<SeoulPlace> findByPlaceName(String seoulPlace);
}
