package router

import (
	"finanzasMikygo/internal/config"
	"finanzasMikygo/internal/handler"
	"finanzasMikygo/internal/middleware"

	_ "finanzasMikygo/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func New(
	cfg *config.Config,
	ingresoHandler *handler.IngresoHandler,
	dashboardHandler *handler.DashboardHandler,
	sqlHandler *handler.SQLHandler,
	splitHandler *handler.SplitHandler,
) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORS(cfg.CORSOrigin))

	// Serve uploaded files
	r.Static("/uploads", cfg.UploadDir)

	// Swagger
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")
	{
		// Ingresos
		ingresos := api.Group("/ingresos")
		{
			ingresos.POST("", ingresoHandler.Create)
			ingresos.GET("", ingresoHandler.GetAll)
			ingresos.GET("/fechas-ocupadas", ingresoHandler.GetFechasOcupadas)
			ingresos.POST("/upload", ingresoHandler.Upload)
			ingresos.GET("/:id", ingresoHandler.GetByID)
			ingresos.PUT("/:id", ingresoHandler.Update)
			ingresos.DELETE("/:id", ingresoHandler.Delete)
		}

		// Dashboard
		dashboard := api.Group("/dashboard")
		{
			dashboard.GET("/summary", dashboardHandler.GetSummary)
			dashboard.GET("/weekly", dashboardHandler.GetWeekly)
			dashboard.GET("/monthly", dashboardHandler.GetMonthly)
			dashboard.GET("/yearly", dashboardHandler.GetYearly)
			dashboard.GET("/history", dashboardHandler.GetHistory)
		}

		// SQL (dev only)
		if cfg.SQLDevEnabled == "true" {
			sql := api.Group("/sql")
			{
				sql.POST("/execute", sqlHandler.Execute)
				sql.GET("/schema", sqlHandler.GetSchema)
			}
		}

		// Splits
		splits := api.Group("/splits")
		{
			splits.GET("/config", splitHandler.GetConfiguraciones)
			splits.PUT("/config", splitHandler.UpdateConfiguraciones)
			splits.GET("", splitHandler.GetAll)
			splits.GET("/ingreso/:id", splitHandler.GetByIngresoID)
			splits.PUT("/:id/realizar", splitHandler.MarcarRealizado)
			splits.PUT("/:id", splitHandler.UpdateMonto)
			splits.DELETE("/:id", splitHandler.DeleteSplit)
		}

		// Cuentas
		cuentas := api.Group("/cuentas")
		{
			cuentas.POST("", splitHandler.CreateCuenta)
			cuentas.GET("", splitHandler.GetAllCuentas)
			cuentas.GET("/:id", splitHandler.GetCuentaByID)
			cuentas.PUT("/:id", splitHandler.UpdateCuenta)
			cuentas.DELETE("/:id", splitHandler.DeleteCuenta)
			cuentas.POST("/:id/qr", splitHandler.UpdateQr)
			cuentas.DELETE("/:id/qr", splitHandler.DeleteQr)
		}
	}

	return r
}
