package main

import (
	"finanzasMikygo/internal/config"
	"finanzasMikygo/internal/database"
	"finanzasMikygo/internal/handler"
	"finanzasMikygo/internal/repository"
	"finanzasMikygo/internal/router"
	"finanzasMikygo/internal/service"
	"log"
)

// @title           Finanzas Mikygo API
// @version         1.0
// @description     API para gestión de ingresos laborales
// @host            localhost:8080
// @BasePath        /api/v1
// @schemes         http
func main() {
	cfg := config.Load()

	db, err := database.NewPool(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	defer db.Close()

	ingresoRepo := repository.NewIngresoRepository(db)
	dashboardRepo := repository.NewDashboardRepository(db)
	cuentaRepo := repository.NewCuentaRepository(db)
	splitRepo := repository.NewSplitRepository(db)

	dashboardSvc := service.NewDashboardService(dashboardRepo)
	splitSvc := service.NewSplitService(splitRepo, cuentaRepo, ingresoRepo)
	ingresoSvc := service.NewIngresoService(ingresoRepo, splitSvc)

	ingresoHandler := handler.NewIngresoHandler(ingresoSvc)
	dashboardHandler := handler.NewDashboardHandler(dashboardSvc)
	sqlHandler := handler.NewSQLHandler(db)
	splitHandler := handler.NewSplitHandler(splitSvc)

	r := router.New(cfg, ingresoHandler, dashboardHandler, sqlHandler, splitHandler)

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
