package com.paf.unidesk.repository;

import com.paf.unidesk.model.Comment;
import com.paf.unidesk.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByTicket(Ticket ticket);
}